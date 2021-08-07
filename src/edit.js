/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/packages/packages-i18n/
 */
import { useRef, useReducer, useCallback } from '@wordpress/element';
import { v4 as uuid } from 'uuid';
/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/packages/packages-block-editor/#useBlockProps
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

const ADD_TAG = 'ADD_TAG';
const REMOVE_TAG = 'REMOVE_TAG';
const MOVE_TAG = 'MOVE_TAG';
const EDIT_TAG = 'EDIT_TAG';
function tagsReducer( state, { type, payload } ) {
	switch ( type ) {
		case ADD_TAG:
			return [ ...state, { x: payload.x, y: payload.y, id: uuid() } ];
		case REMOVE_TAG:
			return [ ...state.filter( ( tag ) => tag !== payload.id ) ];
		case MOVE_TAG:
			return { count: state.count - 1 };
		case EDIT_TAG:
			return { count: state.count - 1 };
		default:
			throw new Error();
	}
}

function isTag( target ) {
	return !! target?.classList.contains( 'tagged-block-tag' );
}

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/block-edit-save/#edit
 * @return {WPElement} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { tags } = attributes;
	const ref = useRef();
	const blockProps = useBlockProps( { ref } );
	const getPosition = useCallback( ( event ) => {
		const rect = ref.current.getBoundingClientRect();
		const x = event.clientX - rect.left; //x position within the element.
		const y = event.clientY - rect.top; //y position within the element.
		return [ x, y ];
	}, [] );
	const dispatch = useCallback(
		( action ) => {
			setAttributes( {
				tags: tagsReducer( tags, action ),
			} );
		},
		[ setAttributes, tags ]
	);
	const handleClick = useCallback(
		( event ) => {
			const [ x, y ] = getPosition( event );
			dispatch( { type: ADD_TAG, payload: { x, y } } );
		},
		[ getPosition, dispatch ]
	);
	return (
		<figure { ...blockProps }>
			<img
				src="https://i.redd.it/u2v4cx280g071.jpg"
				onClick={ handleClick }
				ref={ ref }
			/>
			<div className="tags">
				{ tags.map( ( tag ) => (
					<div
						className="tag"
						key={ tag.id }
						style={ {
							transform: `translate(${ tag.x }px, ${ tag.y }px)`,
						} }
					/>
				) ) }
			</div>
		</figure>
	);
}
