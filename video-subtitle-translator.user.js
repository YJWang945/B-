// ==UserScript==
// @name         Bilibili Chinese to English Subtitle Translator
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add English subtitles for Chinese videos on Bilibili
// @author       YJWang945
// @match        *://*.bilibili.com/video/*
// @match        *://*.bilibili.com/bangumi/*
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @connect      fanyi-api.baidu.com
// @connect      api.fanyi.baidu.com
// @connect      *
// @run-at       document-start
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        appId: '你的appId',
        secretKey: '你的secretKey',
        targetLang: 'en'
    };

    // 使用Promise包装GM_xmlhttpRequest
    function makeRequest(options) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    ...options,
                    onload: resolve,
                    onerror: reject
                });
            } else if (typeof GM !== 'undefined' && GM.xmlHttpRequest) {
                GM.xmlHttpRequest({
                    ...options,
                    onload: resolve,
                    onerror: reject
                });
            } else {
                reject(new Error('No GM_xmlhttpRequest available'));
            }
        });
    }

    async function translateText(text) {
        const salt = Date.now();
        const sign = MD5(config.appId + text + salt + config.secretKey);
        const params = new URLSearchParams({
            q: text,
            from: 'zh',
            to: 'en',
            appid: config.appId,
            salt: String(salt),
            sign: sign
        }).toString();
        
        console.log('Sending translation request for:', text);
        console.log('Request parameters:', params);
        
        try {
            const response = await makeRequest({
                method: 'POST',
                url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: params
            });

            console.log('Raw API response:', response.responseText);
            const result = JSON.parse(response.responseText);
            
            if (result.error_code) {
                console.error('Translation API error:', result.error_code, result.error_msg);
                return '';
            }
            
            if (result.trans_result && result.trans_result[0]) {
                console.log('Translation result:', result.trans_result[0].dst);
                return result.trans_result[0].dst;
            }
            
            console.log('No translation result found in response');
            return '';
        } catch (error) {
            console.error('Translation request failed:', error);
            return '';
        }
    }

    function addTranslatedSubtitle(element, translatedText) {
        if (!translatedText) return;
        
        let translatedElement = element.nextElementSibling;
        if (!translatedElement?.classList.contains('translated-subtitle')) {
            translatedElement = document.createElement('div');
            translatedElement.className = 'translated-subtitle';
            element.parentNode.insertBefore(translatedElement, element.nextSibling);
        }
        translatedElement.textContent = translatedText;
    }

    async function handleSubtitle(element) {
        if (element.dataset.translated) return;
        
        const text = element.textContent.trim();
        if (!text || !/[\u4e00-\u9fa5]/.test(text)) return;

        console.log('Processing subtitle:', text);
        element.dataset.translated = 'true';
        
        try {
            const translatedText = await translateText(text);
            if (translatedText) {
                console.log('Adding translation:', translatedText);
                
                // 找到字幕面板
                const panel = element.closest('.bpx-player-subtitle-panel');
                if (panel) {
                    // 移除所有现有的翻译字幕
                    panel.querySelectorAll('.translated-subtitle').forEach(el => el.remove());
                    
                    // 创建新的翻译文本元素
                    const translatedElement = document.createElement('div');
                    translatedElement.className = 'translated-subtitle';
                    translatedElement.textContent = translatedText;
                    
                    panel.appendChild(translatedElement);
                    console.log('Translation added to subtitle panel');
                }
            }
        } catch (error) {
            console.error('Translation error:', error);
        }
    }

    function initScript() {
        const maxAttempts = 30; // 最多尝试30次
        let attempts = 0;
        
        function tryInit() {
            console.log('Attempting to initialize subtitle translator:', attempts + 1);
            
            if (attempts >= maxAttempts) {
                console.log('Failed to initialize subtitle translator after maximum attempts');
                return;
            }
            
            const subtitleContainer = document.querySelector('.bpx-player-subtitle-wrap');
            if (subtitleContainer) {
                console.log('Found subtitle container, setting up observer');
                setupSubtitleObserver(subtitleContainer);
            } else {
                console.log('Subtitle container not found, retrying...');
                attempts++;
                setTimeout(tryInit, 1000);
            }
        }
        
        // 替换原有的初始化代码
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', tryInit);
        } else {
            tryInit();
        }
    }

    // 的观察设置函数
    function setupSubtitleObserver(container) {
        console.log('Setting up subtitle observer for container:', container);

        function processSubtitles() {
            // 更新选择器以匹配实际的DOM结构
            const selectors = [
                '.bpx-player-subtitle-panel-text',     // 新版播放器字幕文本
                'span[class*="subtitle-panel-text"]',  // 备用选择器
            ];

            // 重置所有字幕的翻译状态
            document.querySelectorAll('.bpx-player-subtitle-panel-text').forEach(el => {
                delete el.dataset.translated;
            });

            // 检查所有可能的选择器
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log(`Found ${elements.length} elements with selector: ${selector}`);
                    elements.forEach(element => {
                        const text = element.textContent.trim();
                        if (text && /[\u4e00-\u9fa5]/.test(text)) {
                            console.log('Found Chinese subtitle:', text);
                            handleSubtitle(element);
                        }
                    });
                    // 如果找到了元素就跳出循环
                    break;
                }
            }
        }

        // 创建观察者
        const observer = new MutationObserver((mutations) => {
            let hasSubtitleChange = false;
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    const target = mutation.target;
                    if (target.classList && target.classList.contains('bpx-player-subtitle-panel-text')) {
                        hasSubtitleChange = true;
                    }
                }
            });

            if (hasSubtitleChange) {
                setTimeout(processSubtitles, 100);
            }
        });

        // 观察配置
        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // 定期检查字幕
        const checkInterval = setInterval(processSubtitles, 1000);

        // 立即处理当前字幕
        processSubtitles();

        // 5分钟后清除定时器
        setTimeout(() => clearInterval(checkInterval), 300000);
    }

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        /* 隐藏原始中文字幕 */
        .bpx-player-subtitle-panel-text {
            display: none !important;
        }

        /* 调整英文翻译字幕的样式 */
        .translated-subtitle {
            color: yellow !important;
            font-size: 30px !important;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
            position: absolute !important;
            text-align: center !important;
            width: 100% !important;
            z-index: 9999 !important;
            pointer-events: none !important;
            background: transparent !important;
            padding: 4px 0 !important;
            display: block !important;
            font-family: "Microsoft YaHei", "PingFang SC", sans-serif !important;
            line-height: 1.5 !important;
            bottom: 10px !important; /* 调整位置，避免与播放器控件重叠 */
            left: 0 !important;
        }
    `;
    document.head.appendChild(style);

    function MD5(string) {
        return CryptoJS.MD5(string).toString();
    }

    // 删除原有的observeSubtitles函数，使用新的initScript
    initScript();
})(); 
