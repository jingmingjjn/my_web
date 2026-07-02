# 部署到 www.20050223.xyz

这个目录是一个纯静态网站，可以部署到 GitHub Pages、Netlify、Vercel、Cloudflare Pages 或宝塔/Nginx 静态站点。

## GitHub Pages 方式

1. 新建一个 GitHub 仓库。
2. 上传本目录里的所有文件，包括 `index.html`、`styles.css`、`app.js`、`assets/` 和 `CNAME`。
3. 在仓库 Settings -> Pages 中启用 Pages。
4. Custom domain 填写：

```text
www.20050223.xyz
```

5. 到你的域名 DNS 控制台添加：

```text
类型: CNAME
主机记录: www
记录值: 你的 GitHub Pages 地址，例如 username.github.io
```

如果也想让 `20050223.xyz` 不带 www 访问，需要额外添加 A 记录或做 URL 转发，具体取决于域名服务商支持的功能。

## 已准备的文件

`CNAME` 已经写入 `www.20050223.xyz`，适合 GitHub Pages 自动识别自定义域名。
