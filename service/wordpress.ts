import request from "../utils/http";

export function getCategories(params?) {
    return request.get('/wp-json/wp/v2/categories?per_page=50', {
        params
    })
}

export function getPosts(params?) {
    return request.get('/wp-json/wp/v2/posts?context=embed&status=publish&_embed=true', {
        params
    })
}

export function getPost(id) {
    return request.get(`/wp-json/wp/v2/posts/${id}?context=view`, {
        headers: {
            referer: 'https://www.b-pay.life/'
        }
    })
}

export function getAuth(token) {
    return request.get(`/wp-json/wp/v2/users/me`, {
        headers: {
            authorization: token
        }
    })
}

export function getMatrixAuth() {
    return request.get(`/wp-json/bpay/v1/matrixToken`)
}

export function getAuthor(id) {
    return request.get(`/wp-json/wp/v2/users/${id}`)
}