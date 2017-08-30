import anime from 'animejs';
import Button from './Button.jsx';
import classNames from 'classnames';
import { DraggableCore } from 'react-draggable';
import EditableText from './EditableText.jsx';
import eventbus from '../services/eventbus';
import PropTypes from 'prop-types';
import React from 'react';

class Post extends React.PureComponent {
  constructor (props) {
    super(props);

    this.handleElementRefChanged = this.handleElementRefChanged.bind(this);
    this.handleImageRefChanged = this.handleImageRefChanged.bind(this);

    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragMove = this.handleDragMove.bind(this);
    this.handleDragStop = this.handleDragStop.bind(this);
    this.handleEditingStarted = this.handleEditingStarted.bind(this);
    this.handleTextEdited = this.handleTextEdited.bind(this);
    this.handleEditingStopped = this.handleEditingStopped.bind(this);
    this.handleTextChanged = this.handleTextChanged.bind(this);
    this.handleContextMenuButtonClicked = this.handleContextMenuButtonClicked.bind(this);
    this.handleFullscreenButtonPressed = this.handleFullscreenButtonPressed.bind(this);
    this.handleMenuItemSelected = this.handleMenuItemSelected.bind(this);

    this.state = {
      isBeingEdited: false,
      isBeingDragged: false,
      rotation: 0,
      left: props.left,
      top: props.top
    };
  }

  componentDidUpdate (prevProps) {
    /*
    * If the backend has save the new values after a move, a new position
    * will be passed down. Then it's time to remove the dragging values.
    */
    if (prevProps.left !== this.props.left || prevProps.top !== this.props.top) {
      this.setState({
        dragging: null
      });
    }
  }

  componentWillEnter (done) {
    anime({
      targets: this.element,
      opacity: [ 0, 1 ],
      scale: [ 1.4, 1 ],
      duration: () => anime.random(300, 400),
      easing: 'easeOutBack',
      complete: done
    });
  }

  componentWillLeave (done) {
    anime({
      targets: this.element,
      opacity: [ 1, 0 ],
      translateY: [ 0, 40 ],
      duration: () => anime.random(300, 600),
      easing: 'easeOutExpo',
      complete: done
    });
  }

  handleElementRefChanged (element) {
    this.element = element;
  }

  handleImageRefChanged (image) {
    this.imageRef = image;
  }

  didMove (newPosition) {
    return this.state.previousPosition.left !== newPosition.left ||
           this.state.previousPosition.top !== newPosition.top;
  }

  handleEditingStarted () {
    this.setState({
      isBeingEdited: true
    });
  }

  handleEditingStopped () {
    this.setState({
      isBeingEdited: false
    });
  }

  handleTextChanged (newText) {
    if (newText.includes(':)') || newText.includes(':-)')) {
      this.props.onColorChange(this.props.id, 'green');
    } else if (newText.includes(':(') || newText.includes(':-(')) {
      this.props.onColorChange(this.props.id, 'red');
    }
  }

  handleTextEdited (newText) {
    this.props.onEdit(this.props.id, newText);
  }

  handleContextMenuButtonClicked (event) {
    const items = [];

    if (!this.props.isDone) {
      items.push({ id: 'markAsDone', label: 'Mark as done' });
    }

    items.push({ id: 'throwAway', label: 'Throw away' });

    eventbus.emit('context-menu-open', {
      target: event.currentTarget,
      items,
      onItemSelected: this.handleMenuItemSelected
    });
  }

  handleFullscreenButtonPressed () {
    this.props.onFullscreenRequest({
      type: this.props.type,
      content: this.props.content,
      element: this.imageRef
    });
  }

  handleMenuItemSelected (id) {
    switch (id) {
      case 'markAsDone':
        this.props.onMarkAsDone(this.props.id);
        break;
      case 'throwAway':
        this.props.onThrowAway(this.props.id);
        break;
      default:
        break;
    }
  }

  handleDragStart (event, data) {
    const { node } = data;
    const parentRect = node.offsetParent.getBoundingClientRect();
    const clientRect = node.getBoundingClientRect();

    this.setState({
      isBeingDragged: true,
      previousPosition: {
        left: this.props.left,
        top: this.props.top
      },
      dragging: {
        left: clientRect.left - parentRect.left + node.offsetParent.scrollLeft,
        top: clientRect.top - parentRect.top + node.offsetParent.scrollTop
      }
    });
  }

  handleDragMove (event, data) {
    const { deltaX, deltaY } = data;

    this.setState({
      rotation: `rotate(${(deltaX * 0.2)}deg)`,
      dragging: {
        left: this.state.dragging.left + deltaX,
        top: this.state.dragging.top + deltaY
      }
    });
  }

  handleDragStop () {
    if (this.didMove(this.state.dragging)) {
      this.props.onMoveEnd(this.props.id, {
        top: this.state.dragging.top,
        left: this.state.dragging.left
      });
    }

    this.setState({
      rotation: null,
      isBeingDragged: false,
      previousPosition: null
    });
  }

  renderTextContent () {
    return (
      <EditableText
        className='content'
        initialText={ this.props.content }
        onEditingStarted={ this.handleEditingStarted }
        onChange={ this.handleTextChanged }
        onEditingStopped={ this.handleEditingStopped }
        onEdited={ this.handleTextEdited }
      />
    );
  }

  renderImageContent () {
    return (
      <div className='content'>
        <img ref={ this.handleImageRefChanged } src={ this.props.content.url } />
      </div>
    );
  }

  renderContent () {
    let content;

    switch (this.props.type) {
      case 'text':
        content = this.renderTextContent();
        break;
      case 'image':
        content = this.renderImageContent();
        break;
      default:
        break;
    }

    return content;
  }

  renderMetaActions () {
    const menuButton = (
      <div className='meta__button'>
        <Button
          type='context-menu'
          icon='context-menu'
          iconSize='small'
          onClick={ this.handleContextMenuButtonClicked }
        />
      </div>
    );

    let fullScreenButton = null;

    if (this.props.type === 'image') {
      fullScreenButton = (
        <div className='meta__button'>
          <Button
            icon='fullscreen'
            iconSize='small'
            onClick={ this.handleFullscreenButtonPressed }
          />
        </div>
      );
    }

    const creator = <div className='created-by'><span>by</span> {this.props.creator}</div>;

    return (
      <div className='meta'>
        {creator}
        {fullScreenButton}
        {menuButton}
      </div>
    );
  }

  render () {
    const postClasses = {
      'ui-post': true,
      editing: this.state.isBeingEdited,
      dragging: this.state.isBeingDragged,
      done: this.props.isDone
    };
    const { dragging, isBeingEdited, rotation } = this.state;

    postClasses[this.props.color] = true;

    const position = {
      left: this.props.left,
      top: this.props.top
    };

    if (dragging) {
      position.left = dragging.left;
      position.top = dragging.top;
    }

    return (
      <DraggableCore
        disabled={ isBeingEdited }
        onStart={ this.handleDragStart }
        onDrag={ this.handleDragMove }
        onStop={ this.handleDragStop }
      >
        <div
          className='ui-post-container'
          style={{ transform: `translate(${position.left}px, ${position.top}px)` }}
        >
          <div
            ref={ this.handleElementRefChanged }
            className={ classNames(postClasses) }
            data-type={ this.props.type }
            style={{ transform: rotation }}
          >
            {this.renderContent()}
            {this.renderMetaActions()}
          </div>
        </div>
      </DraggableCore>
    );
  }
}

Post.defaultProps = {
  type: 'text',
  content: '',
  left: 0,
  top: 0,
  color: 'yellow',
  isDone: false,
  creator: '',
  onMoveEnd () {},
  onColorChange () {},
  onEdit () {}
};

Post.propTypes = {
  content: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]).isRequired,
  left: PropTypes.number.isRequired,
  top: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  color: PropTypes.string,
  creator: PropTypes.string,
  onColorChange: PropTypes.func,
  onEdit: PropTypes.func,
  onFullscreenRequest: PropTypes.func,
  onMarkAsDone: PropTypes.func,
  onMoveEnd: PropTypes.func,
  onThrowAway: PropTypes.func
};

export default Post;