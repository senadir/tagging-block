import Draggable from 'react-draggable';

export default function Tag( { x: initialX, y: initialY, onMove } ) {
	return (
		<Draggable
			handle=".tag"
			defaultPosition={ { x: initialX, y: initialY } }
			onStop={ ( event, { x, y } ) => onMove( x, y ) }
		>
			<div className="tag" />
		</Draggable>
	);
}
