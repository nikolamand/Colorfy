(function (global) {
	let clearAll = document.getElementById("clear_all_changes");
	clearAll.value = chrome.i18n.getMessage("optionsResetButton");
	clearAll.addEventListener("click", clearAllChanges);

	function clearAllChanges() {
		if (confirm(chrome.i18n.getMessage("optionsResetConfirm")))
			browser.storage.local.clear(function () {
				var error = chrome.runtime.lastError;
				if (error)
					console.error(error);
				else
					alert(chrome.i18n.getMessage("optionsResetSuccess"));
			});
	}
})(window);
