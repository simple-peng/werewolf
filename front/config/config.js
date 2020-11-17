export default {
    //配置跨域,比如访问http://localhost:8000/api/captcha就能访问到http://localhost:7002/captcha的数据
    proxy: {
      '/api/': {
        'target': 'http://localhost:7001',
        'secure': false,// 不进行证书验证
        'pathRewrite': { '^/api' : '' },
      },
    }
}