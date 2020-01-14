(function (global) {
	let clearAll = document.getElementById("clear_all_changes");
	clearAll.addEventListener("click", clearAllChanges);

	function clearAllChanges() {
		if (confirm("Are you sure you want to remove changes from all of the selected websites?\nThis process is ireversable!"))
			chrome.storage.local.clear(function () {
				var error = chrome.runtime.lastError;
				if (error)
					console.error(error);
				else
					alert("All changes have been removed!");
			});
	}
})(window);
