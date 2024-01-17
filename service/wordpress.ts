import request from "../utils/http";

export function getCategories(params?) {
    return request.get('/wp-json/wp/v2/categories?per_page=50', {
        params
    })
}