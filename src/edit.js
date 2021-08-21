import { useRef, useCallback, useState, useMemo } from '@wordpress/element';
import { v4 as uuid } from 'uuid';
import useResizeObserver from 'use-resize-observer';
import { ToolbarButton } from '@wordpress/components';
import { tag as tagIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import {
	useBlockProps,
	BlockControls,
	withColors,
	PanelColorSettings,
	ContrastChecker,
	InspectorControls,
	getColorClassName,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';

import './editor.scss';
import { Tag } from './components';

const ADD_TAG = 'ADD_TAG';
const REMOVE_TAG = 'REMOVE_TAG';
const MOVE_TAG = 'MOVE_TAG';
const EDIT_TAG = 'EDIT_TAG';
function tagsReducer( state, { type, payload } ) {
	switch ( type ) {
		case ADD_TAG:
			return [
				...state,
				{ x: payload.x, y: payload.y, id: uuid(), link: payload.link },
			];
		case REMOVE_TAG:
			return [ ...state.filter( ( tag ) => tag !== payload.id ) ];
		case MOVE_TAG:
			state.splice(
				state.findIndex( ( tag ) => tag.id === payload.id ),
				1,
				{
					link: state.find( ( tag ) => tag.id === payload.id ).link,
					x: payload.x,
					y: payload.y,
					id: payload.id,
				}
			);
			return [ ...state ];
		case EDIT_TAG:
			return [
				...state.map( ( tag ) => {
					if ( tag.id === payload.id ) {
						return {
							...tag,
							link: { ...tag.link, ...payload.link },
						};
					}
					return tag;
				} ),
			];
		default:
			throw new Error();
	}
}

function isTag( target ) {
	return !! target?.classList.contains( 'tagged-block-tag' );
}

function throttle( func, timeFrame ) {
	let lastTime = 0;
	return function ( ...args ) {
		const now = new Date();
		if ( now - lastTime >= timeFrame ) {
			func( ...args );
			lastTime = now;
		}
	};
}

/**
 * @return {WPElement} Element to render.
 */
function Edit( {
	attributes,
	setAttributes,
	textColor,
	setTextColor,
	backgroundColor,
	setBackgroundColor,
	...props
} ) {
	const { tags } = attributes;
	const ref = useRef();
	const [ size, setSize ] = useState( {} );
	const [ temporaryTag, setTemporaryTag ] = useState( null );
	const [ isAddingTags, setIsAddingTags ] = useState( () => ! tags.length );
	useResizeObserver( {
		ref,
		onResize: throttle( setSize, 500 ),
	} );
	const relativeTags = useMemo( () => {
		if ( size.width && size.height ) {
			return tags.map( ( tag ) => ( {
				...tag,
				x: size.width * tag.x,
				y: size.height * tag.y,
			} ) );
		}
		return [];
	}, [ size.width, size.height, tags ] );
	const blockProps = useBlockProps();

	const getPosition = useCallback(
		( event ) => {
			const rect = ref.current.getBoundingClientRect();
			const x = ( event.clientX - rect.left ) / size.width; //x position within the element.
			const y = ( event.clientY - rect.top ) / size.height; //y position within the element.
			return [ x, y ];
		},
		[ size ]
	);
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
			if ( isAddingTags ) {
				const [ x, y ] = getPosition( event );
				setTemporaryTag( { x, y, id: null } );
			}
		},
		[ getPosition, isAddingTags ]
	);

	const updateTag = useCallback(
		( link, id ) => {
			return dispatch( {
				type: EDIT_TAG,
				payload: {
					link,
					id,
				},
			} );
		},
		[ dispatch ]
	);

	const persistTemporaryTag = useCallback(
		( link ) => {
			if ( link?.url ) {
				dispatch( {
					type: ADD_TAG,
					payload: {
						link,
						...temporaryTag,
					},
				} );
			}
			setTemporaryTag( null );
		},
		[ dispatch, temporaryTag ]
	);

	const removeTag = useCallback(
		( id ) => {
			dispatch( {
				type: REMOVE_TAG,
				payload: {
					id,
				},
			} );
		},
		[ dispatch ]
	);

	const tagClassnames = classnames( textColor.class, backgroundColor.class );
	const tagStyles = ! ( textColor.class && backgroundColor.class )
		? {
				color: textColor.color,
				backgroundColor: backgroundColor.color,
		  }
		: undefined;
	return (
		<>
			<BlockControls group="block">
				<ToolbarButton
					showTooltip
					onClick={ () => setIsAddingTags( ( prev ) => ! prev ) }
					isActive={ isAddingTags }
					label={ 'Add tags' }
					icon={ tagIcon }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelColorSettings
					title={ __( 'Color' ) }
					initialOpen={ false }
					colorSettings={ [
						{
							value: textColor.color,
							onChange: setTextColor,
							label: __( 'Text' ),
						},
						{
							value: backgroundColor.color,
							onChange: setBackgroundColor,
							label: __( 'Background' ),
						},
					] }
				>
					<>
						<ContrastChecker
							backgroundColor={ backgroundColor.color }
							textColor={ textColor.color }
							fontSize={ '12px' }
						/>
					</>
				</PanelColorSettings>
			</InspectorControls>
			<figure { ...blockProps }>
				<img
					src="https://i.redd.it/u2v4cx280g071.jpg"
					onClick={ handleClick }
					ref={ ref }
				/>
				<div className="tags">
					<>
						{ relativeTags.map( ( tag ) => (
							<Tag
								{ ...tag }
								className={ tagClassnames }
								style={ tagStyles }
								key={ tag.key }
								onMove={ ( x, y ) =>
									dispatch( {
										type: MOVE_TAG,
										payload: {
											x: x / size.width,
											y: y / size.height,
											id: tag.id,
										},
									} )
								}
								onUpdate={ updateTag }
								onRemove={ removeTag }
							/>
						) ) }
						{ !! temporaryTag && (
							<Tag
								className={ tagClassnames }
								style={ tagStyles }
								x={ temporaryTag.x * size.width }
								y={ temporaryTag.y * size.height }
								onUpdate={ persistTemporaryTag }
								onRemove={ () => setTemporaryTag( null ) }
							/>
						) }
					</>
				</div>
			</figure>
		</>
	);
}

export default compose( [
	withColors(
		{ textColor: 'color' },
		{ backgroundColor: 'background-color' }
	),
] )( Edit );
