import React from 'react';

function Crosshair() {
  return (
    <div className="crosshair">
      <div className="crosshair-line horizontal left" />
      <div className="crosshair-line horizontal right" />
      <div className="crosshair-line vertical top" />
      <div className="crosshair-line vertical bottom" />
      <div className="crosshair-dot" />
    </div>
  );
}

export default Crosshair;
