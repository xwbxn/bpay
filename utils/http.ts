import { extend, RequestOptionsInit } from 'umi-request';
import AsyncStorage from '@react-native-async-storage/async-storage';

const request = extend({
    prefix: process.env.EXPO_PUBLIC_API_URL,
    timeout: 5000,
    errorHandler(error) {
        console.log('error', error.data.code)
        if (error.data.code === "invalid_username") {
            AsyncStorage.removeItem("TOKEN")
        }
        throw error
    },
});

console.log('apiurl: ', process.env.EXPO_PUBLIC_API_URL)

request.use(async (ctx, next) => {
    const token = await AsyncStorage.getItem("TOKEN")
    if (token) {
        ctx.req.options.headers = { ...ctx.req.options.headers, authorization: token }
    }
    // console.log('request: ', ctx.req.options.method, ctx.req.url, ctx.req.options.params, ctx.req.options.headers)
    await next()
    return
})

request.interceptors.response.use((response: Response, options: RequestOptionsInit) => {
    // console.log('response: ', response.url, response.status)
    return response
})

export default request