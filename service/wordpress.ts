import request from "../utils/http";

export function getCategories(params?) {
    return request.get('/wp-json/wp/v2/categories?per_page=50', {
        params
    })
}

export function getPosts(params?) {
    return request.get('/wp-json/wp/v2/posts?context=embed&status=publish', {
        params
    })
}

export function getMedia(id) {
    return request.get(`/wp-json/wp/v2/media/${id}`)
}