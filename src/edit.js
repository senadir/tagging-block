import {
	useRef,
	useCallback,
	useState,
	useMemo,
	useEffect,
} from '@wordpress/element';
import { v4 as uuid } from 'uuid';
import useResizeObserver from 'use-resize-observer';
import { ToolbarButton } from '@wordpress/components';
import { tag as tagIcon } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import {
	useBlockProps,
	BlockControls,
	withColors,
	PanelColorSettings,
	ContrastChecker,
	InspectorControls,
	BlockIcon,
	MediaPlaceholder,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { isBlobURL } from '@wordpress/blob';
import { get, has, omit, pick } from 'lodash';

import './editor.scss';
import { Tag } from './components';
import Image from './image'

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
 * Is the url for the image hosted externally. An externally hosted image has no
 * id and is not a blob url.
 *
 * @param {number=} id  The id of the image.
 * @param {string=} url The url of the image.
 * @return {boolean} Is the url an externally hosted url?
 */
export const isExternalImage = ( id, url ) => url && ! id && ! isBlobURL( url );

/**
 * Checks if WP generated default image size. Size generation is skipped
 * when the image is smaller than the said size.
 *
 * @param {Object} image
 * @param {string} defaultSize
 * @return {boolean} Whether or not it has default image size.
 */
function hasDefaultSize( image, defaultSize ) {
	return (
		has( image, [ 'sizes', defaultSize, 'url' ] ) ||
		has( image, [ 'media_details', 'sizes', defaultSize, 'source_url' ] )
	);
}

export const pickRelevantMediaFiles = ( image, size ) => {
	let { url, alt, id, link, caption } = image;
	url =
		image?.sizes?.[ size ]?.url ||
		image?.media_details?.sizes?.[ size ]?.source_url ||
		image.url;
	return { alt, id, link, caption, url };
};
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
} ) {
	const { tags, url, id: imageId, alt, caption } = attributes;
	console.log( attributes );
	const altRef = useRef();
	useEffect( () => {
		altRef.current = alt;
	}, [ alt ] );

	const captionRef = useRef();
	useEffect( () => {
		captionRef.current = caption;
	}, [ caption ] );
	const ref = useRef();
	const containerRef = useRef();
	const { imageDefaultSize } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return pick( getSettings(), [ 'imageDefaultSize', 'mediaUpload' ] );
	}, [] );
	const [ size, setSize ] = useState( {} );
	const [ temporaryTag, setTemporaryTag ] = useState( null );
	const [ isAddingTags, setIsAddingTags ] = useState( () => ! tags.length );
	const [ temporaryURL, setTemporaryURL ] = useState();

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
	const blockProps = useBlockProps({
		ref: containerRef
	});

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

	const isExternal = isExternalImage( imageId, url );
	const src = isExternal ? url : undefined;

	const mediaPreview = !! url && (
		<img
			alt={ __( 'Edit image' ) }
			title={ __( 'Edit image' ) }
			className={ 'edit-image-preview' }
			src={ url }
		/>
	);

	function onSelectImage( media ) {
		if ( ! media || ! media.url ) {
			setAttributes( {
				url: undefined,
				alt: undefined,
				id: undefined,
				title: undefined,
				caption: undefined,
			} );

			return;
		}

		if ( isBlobURL( media.url ) ) {
			setTemporaryURL( media.url );
			return;
		}

		setTemporaryURL();

		let mediaAttributes = pickRelevantMediaFiles( media, imageDefaultSize );

		// If a caption text was meanwhile written by the user,
		// make sure the text is not overwritten by empty captions.
		if ( captionRef.current && ! get( mediaAttributes, [ 'caption' ] ) ) {
			mediaAttributes = omit( mediaAttributes, [ 'caption' ] );
		}

		let additionalAttributes;
		// Reset the dimension attributes if changing to a different image.
		if ( ! media.id || media.id !== imageId ) {
			additionalAttributes = {
				width: undefined,
				height: undefined,
				// Fallback to size "full" if there's no default image size.
				// It means the image is smaller, and the block will use a full-size URL.
				sizeSlug: hasDefaultSize( media, imageDefaultSize )
					? imageDefaultSize
					: 'full',
			};
		} else {
			// Keep the same url when selecting the same file, so "Image Size"
			// option is not changed.
			additionalAttributes = { url };
		}

		setAttributes( {
			...mediaAttributes,
			...additionalAttributes,
		} );
	}

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
			{ ! url ? (
				<MediaPlaceholder
					icon={ <BlockIcon icon={ tagIcon } /> }
					onSelect={ onSelectImage }
					onSelectURL={ () => 'onSelectURL' }
					onError={ () => 'onUploadError' }
					accept="image/*"
					allowedTypes={ [ 'image' ] }
					value={ { id: imageId, src } }
					mediaPreview={ mediaPreview }
					disableMediaButtons={ temporaryURL || url }
				/>
			) : (
				<figure { ...blockProps }>
					{ ( temporaryURL || url ) && (
				<Image
					temporaryURL={ temporaryURL }
					attributes={ attributes }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
					insertBlocksAfter={ insertBlocksAfter }
					onReplace={ onReplace }
					onSelectImage={ onSelectImage }
					onSelectURL={ onSelectURL }
					onUploadError={ onUploadError }
					containerRef={ containerRef }
					ref={ref}
					context={ context }
					clientId={ clientId }
				/>
			) }
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
			) }
		</>
	);
}

export default compose( [
	withColors(
		{ textColor: 'color' },
		{ backgroundColor: 'background-color' }
	),
] )( Edit );
