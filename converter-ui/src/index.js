import React from "react";
import ReactDom from "react-dom";
import "./css/App.css";
import App from "./bbb/application";

let wrapper = document.getElementById("beaglebone");
if (!wrapper) {
    let wrappers = document.getElementsByTagName('beaglebone');
    if (wrappers.length > 0) {
        wrapper = wrappers[0];
    }
}
if (wrapper) {
    var st = wrapper.getAttribute('style');
    var config = wrapper.getAttribute('config');
    if (document.getElementsByClassName('.device-mobile-optimized').length > 0) {
        if (wrapper.parentElement.tagName === 'DIV' || wrapper.parentElement.tagName === 'div') {
            let p = wrapper.parentElement;
            p.id = 'wzd1';
        }
    }
    ReactDom.render(
        <React.StrictMode>
            <App config={ config }/>
        </React.StrictMode>, wrapper);
}
else {
    console.log("no such element found");
};
