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
    return request.get(`/wp-json/wp/v2/posts/${id}?context=view`)
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