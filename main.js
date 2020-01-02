
(function(global){
    var selectedElement;
    //Saves background color for the element if there is inline CSS on the element
    var saveBackground;

    const changeColor = () => {
        var selectedColor = popupColorPicker.value;
        //Remove images from background
        selectedElement.style.background = 'none';
        selectedElement.style.backgroundColor = selectedColor;
    }

    var popupColorPicker = document.createElement('input');
    popupColorPicker.type = 'color';
    popupColorPicker.id = 'popupColorPicker';
    popupColorPicker.value = '#0000ff'
    popupColorPicker.hidden = true;
    document.getElementsByTagName('body')[0].appendChild(popupColorPicker);

    popupColorPicker.oninput = changeColor;

    //Change element background when hovered over (mouseover event)
    const hoverElements = (e) => {
        e = e || window.event;
        let target = e.target || e.srcElement;
        saveBackground = target.style.backgroundColor;
        target.style.backgroundColor = 'rgba(0,130,255,0.3)';
    }
    
    //Return  element background
    const resetHover = (e) => {
        e = e || window.event;
        let target = e.target || e.srcElement;
        target.style.backgroundColor = saveBackground;
    }

    const selectElement = (e) => {
        e = e || window.event;
        let target = e.target || e.srcElement;   
        if(target == popupColorPicker)
            return;
        else
            selectedElement = target;
        console.log(selectedElement);
        elementInfo(selectedElement);
        // popupColorPicker.click();
        document.removeEventListener('click', selectElement);
        document.removeEventListener('mouseover', hoverElements);
        document.removeEventListener('mouseout', resetHover);
        resetHover(e);
    }

    const elementInfo = (element) => {
        let elementId = element.id;
        let elementClass = element.className;
        let elementNodeName = element.nodeName;
        let parentElement = element.parentNode;
        let tree = [element];
        do{
            tree.push(parentElement);
            parentElement = parentElement.parentNode;
        }while(parentElement.nodeName != 'BODY');
        console.log(tree);
    }

    document.addEventListener('click', selectElement, false);
    document.addEventListener('mouseover', hoverElements, false);
    document.addEventListener('mouseout', resetHover, false);
})(window)


