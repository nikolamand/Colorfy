
const getBaseURL = () => {
    let getUrl = window.location;
    let baseUrl = getUrl .protocol + "//" + getUrl.host;
    return baseUrl;
}
