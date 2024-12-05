# B站字幕中英翻译助手

一个可以实时将B站视频中文字幕翻译成英文的油猴脚本，使用百度翻译API进行翻译。

## 功能特点

- 自动检测并翻译中文字幕为英文
- 替换原有中文字幕为英文翻译
- 可自定义字幕样式
- 实时翻译，随字幕变化而更新

## 使用前准备

1. 安装 [Tampermonkey（油猴）](https://www.tampermonkey.net/) 浏览器扩展
2. 获取百度翻译API凭证：
   - 在[百度翻译开放平台](https://fanyi-api.baidu.com/)注册账号
   - 创建应用以获取 `appId` 和 `secretKey`

## 安装步骤

1. 在浏览器中安装油猴扩展
2. 在油猴中创建新脚本
3. 将 `video-subtitle-translator.user.js` 的完整内容复制到编辑器中
4. 修改配置部分的API凭证：
   ```javascript
   const config = {
       appId: '你的APPID',           // 替换为你的百度API appId
       secretKey: '你的密钥',        // 替换为你的百度API secretKey
       targetLang: 'en'             // 如果需要翻译成其他语言可以修改这里
   };
   ```
5. 保存脚本

## 使用方法

1. 开启脚本，访问任意B站视频页面
2. 打开字幕功能，脚本会自动检测中文字幕并进行翻译
3. 翻译后的英文字幕会以黄色文字显示在视频底部

## 自定义设置

你可以通过修改脚本中的CSS样式来自定义字幕的外观：

```css
.translated-subtitle {
    color: yellow !important;              /* 修改字幕颜色 */
    font-size: 30px !important;           /* 修改字体大小 */
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;  /* 修改文字阴影 */
    bottom: 10px !important;              /* 调整垂直位置 */
    /* 其他样式... */
}
```

## 注意事项

1. 使用本脚本需要百度翻译API账号
2. 百度翻译API免费版有每日使用限制
3. 请妥善保管你的API凭证，不要泄露
4. 目前仅支持中文到英文的翻译

## 常见问题解决

如果翻译没有出现：
1. 检查浏览器控制台是否有错误信息
2. 验证API凭证是否正确
3. 确认是否超出API使用配额
4. 检查视频是否开启了中文字幕

## 参与贡献

欢迎提交问题和改进建议！


## 致谢

- 感谢百度翻译API提供翻译服务
- 基于油猴脚本平台构建

## 作者

YJWang945

## 免责声明

本脚本仅供学习交流使用。请遵守B站的服务条款和百度翻译API的使用条款。
