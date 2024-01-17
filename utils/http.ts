import { extend } from 'umi-request';

const request = extend({
    prefix: process.env.EXPO_PUBLIC_API_URL,
    timeout: 1000,
});

console.log('apiurl: ', process.env.EXPO_PUBLIC_API_URL)

export default request