import React, { useState } from "react";

export default function Button(props) {
  let { children, action } = props;
  let [active, setActive] = useState(false);
  const onTouchStart = (event) => {
    setActive(true);
  };
  const onTouchMove = (event) => {
    let { top, right, bottom, left } = event.target.getBoundingClientRect();
    let [{ clientX, clientY }] = event.touches;
    active =
      clientX > left && clientX < right && clientY > top && clientY < bottom;
    setActive(active);
  };
  const onTouchEnd = (event) => {
    if (active) {
      setActive(false);
      action();
    }
  };
  return (
    <div
      className={"button" + (active ? " active" : "")}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <span className="label">{children}</span>
    </div>
  );
}
