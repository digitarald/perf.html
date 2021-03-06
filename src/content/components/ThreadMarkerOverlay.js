import React, { Component, PropTypes } from 'react';
import shallowCompare from 'react-addons-shallow-compare';

import './ThreadMarkerOverlay.css';

class ThreadMarkerOverlay extends Component {

  constructor(props) {
    super(props);
    this._mouseDownListener = this._mouseDownListener.bind(this);
  }

  _mouseDownListener(e) {
    if (!('index' in e.target.dataset)) {
      return;
    }
    this.props.onSelectMarker(+e.target.dataset.index);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  }

  render() {
    const { thread, rangeStart, rangeEnd } = this.props;
    const { markers, stringTable } = thread;
    return (
      <ol className='threadMarkerOverlay'
          onMouseDown={this._mouseDownListener}>
        {
          markers.name.map((markerName, markerIndex) => {
            const time = markers.time[markerIndex];
            if (time < rangeStart || time > rangeEnd) {
              return null;
            }
            let category = 'unknown';
            const data = markers.data[markerIndex];
            if (data) {
              if ('interval' in data) {
                return null;
              }
              if ('category' in data) {
                category = data.category;
              }
            }
            return (
              <li className='threadMarkerOverlayMarkerItem'
                  key={markerIndex}
                  data-index={markerIndex}
                  style={{
                    left: (time - rangeStart) / (rangeEnd - rangeStart) * 100 + '%',
                  }} />
            );
          })
        }
      </ol>
    );
  }

}

ThreadMarkerOverlay.propTypes = {
  thread: PropTypes.shape({
    samples: PropTypes.object.isRequired,
  }).isRequired,
  rangeStart: PropTypes.number.isRequired,
  rangeEnd: PropTypes.number.isRequired,
  onSelectMarker: PropTypes.func.isRequired,
};

export default ThreadMarkerOverlay;
