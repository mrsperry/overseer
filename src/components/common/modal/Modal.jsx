import React from "react";
import "./Modal.scss";

const Modal = ({ title, content, closeButton }) => (
    <section className="modal">
        <div className="modal-bg"/>
        <section className="modal-content">
            <h1>{title}</h1>
            {content}
            <button onClick={() => closeButton.onClick()} className="close bordered-button">
                <span>{closeButton.text}</span>
            </button>
        </section>
    </section>
);
export default React.memo(Modal);