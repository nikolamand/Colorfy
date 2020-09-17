/**
 * Create onClick action for the extension icon
 */
chrome.browserAction.onClicked.addListener(function (tab) {
	chrome.tabs.executeScript(null, { file: "vanilla-picker.min.js" }, function () {
		chrome.tabs.executeScript(null, { file: "main.js" });
	});
});

chrome.extension.onMessage.addListener(function (message, sender) {
	chrome.browserAction.setBadgeText({
		text: message,
		tabId: sender.tab.id
	});
	chrome.browserAction.setBadgeBackgroundColor({
		color: '#3C1A5B',
		tabId: sender.tab.id
	});
});
/**
 * Get basic info about URL
 * @param {string} href Web page URL 
 * @return {object} Object with info from the provided URL
 */
var getLocation = function (href) {
	var loc = document.createElement("a");
	loc.href = href;
	console.log(typeof (loc), loc)
	return loc;
};

/**
 * Returns base URL
 * @param {string} url Optional URL in form of a string (if not provided takes url from the currently opened tab) 
 * @return {string} Base URL in form of a string
 */
const getBaseURL = url => {
	if (url == undefined)
		url = window.location;
	else
		url = getLocation(url);
	let baseUrl = url.protocol + "//" + url.host;
	return baseUrl;
}

/**
 * Remove saved colors for the URL of the currently opened tab
 */
const clearColors = () => {
	let storedData = [];
	let clear = confirm(chrome.i18n.getMessage("pageResetConfirm"));
	if (clear) {
		chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
			chrome.storage.local.get(["Colorfy"], function (data) {
				if (data["Colorfy"]) {
					storedData = JSON.parse(data["Colorfy"]);
					let removeIndex = null;
					for (let i = 0, len = storedData.length; i < len; i++) {
						if (storedData[i]['url'] == getBaseURL(tabs[0].url)) {
							removeIndex = i;
						}
					}
					if (removeIndex != null) storedData.splice(removeIndex, 1);
					storedData = JSON.stringify(storedData);
					chrome.storage.local.set({ "Colorfy": storedData });
				}
			});
		});
		chrome.tabs.reload();
	}
}

/**
 * Create right click option for removal of the saved changes
 */
chrome.contextMenus.create({
	"id": "knkcpioaicifeajdcfjejagihgmlehfn",
	"title": chrome.i18n.getMessage("pageReset"),
	"contexts": ["page", "browser_action"]
});

chrome.contextMenus.onClicked.addListener(clearColors)