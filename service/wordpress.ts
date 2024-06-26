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
export function getAuthor(id) {
    return request.get(`/wp-json/wp/v2/users/${id}`)
}

export function register(data: { username: string, email: string, password: string, agreement: boolean, code: string }) {
    return request.post(`/wp-json/bpay/v1/register`, {
        data
    })
}

export function authenticate(data: { username: string, password: string, code: string }) {
    return request.post(`/wp-json/bpay/v1/authenticate`, {
        data
    })
}

export function updatePassword(data: { prev_password: string, password: string }) {
    return request.post(`/wp-json/bpay/v1/update-password`, {
        data
    })
}

export function sendCode(data: { username: string, code: string }) {
    return request.post(`/wp-json/bpay/v1/send-code`, {
        data
    })
}

export function resetPassword(data: { username: string, password: string, vcode: string }) {
    return request.post(`/wp-json/bpay/v1/reset-password`, {
        data
    })
}

export function deleteUser(data: { vcode: string }) {
    return request.post(`/wp-json/bpay/v1/delete-user`, {
        data
    })
}

export function getProfile() {
    return request.get(`/wp-json/bpay/v1/profile`)
}

export function getMyBalance() {
    return request.get(`/wp-json/bpay/v1/wallet/balance`)
}

export function getMyTransations() {
    return request.get(`/wp-json/bpay/v1/wallet/transations`)
}

export function getMembershipLevels() {
    return request.get(`/wp-json/pmpro/v1/membership_levels`)
}

export function getProducts() {
    return request.get(`/wp-json/bpay/v1/shop/products`);
}

export function getOrders() {
    return request.get(`/wp-json/bpay/v1/shop/orders`);
}

export function createWalletOrder(data: { line_items: { product_id: number, quantity: number }[] }) {
    return request.post(`/wp-json/bpay/v1/wallet/order`, {
        data
    })
}

export function uploadMedia(filename, data) {
    return request.post(`/wp-json/wp/v2/media`, {
        headers: {
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-type": 'multipart/form-data'
        },
        body: data
    })
}


export function createMBlog(data) {
    return request.post('/wp-json/wp/v2/mblog', {
        data
    })
}

export function updateMBlog(id, data) {
    return request.patch(`/wp-json/wp/v2/mblog/${id}`, {
        data
    })
}

export function getMBlogs(params?) {
    return request.get('/wp-json/wp/v2/mblog?context=embed&status=publish&_embed=true', {
        params
    })
}