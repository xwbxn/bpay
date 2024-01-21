import { extend, RequestOptionsInit } from 'umi-request';

const request = extend({
    prefix: process.env.EXPO_PUBLIC_API_URL,
    timeout: 5000,
});

console.log('apiurl: ', process.env.EXPO_PUBLIC_API_URL)

request.interceptors.request.use((url: string, options: RequestOptionsInit) => {
    console.log('request: ', options.method, url, options.params)
    return {
        url, options
    }
})

request.interceptors.response.use((response: Response, options: RequestOptionsInit) => {
    console.log('response: ', response.url, response.status)
    return response
})

export default request