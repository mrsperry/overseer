import * as React from "react";
import "./Modal.scss";

interface IModal {
    title: string;
    content: JSX.Element;
    closeButton: {
        text: string;
        onClick: Function
    };
}

const Modal = ({ title, content, closeButton }: IModal): JSX.Element => (
    <section className="modal">
        <div className="modal-bg"/>
        <section className="modal-content">
            <h1>{title}</h1>
            {content}
            <button onClick={(): void => closeButton.onClick()} className="close bordered-button">
                <span>{closeButton.text}</span>
            </button>
        </section>
    </section>
);
export default React.memo(Modal);