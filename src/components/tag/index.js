/* eslint-disable @wordpress/no-unsafe-wp-apis */
import Draggable from 'react-draggable';
import { useRef, useState, memo } from '@wordpress/element';
import { KeyboardShortcuts, Popover } from '@wordpress/components';
import { __experimentalLinkControlSearchInput as LinkControlSearchInput } from '@wordpress/block-editor';
function Tag( { x: initialX, y: initialY, onMove } ) {
	const nodeRef = useRef();
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );
	const [ link, setLink ] = useState( '' );
	return (
		<Draggable
			handle=".tag"
			position={ { x: initialX, y: initialY } }
			onStop={ ( _, { x, y } ) => onMove( x, y ) }
			nodeRef={ nodeRef }
		>
			<div
				className="tag"
				ref={ nodeRef }
				onClick={ () => setIsLinkOpen( true ) }
			>
				{ isLinkOpen && (
					<Popover
						position="bottom center"
						onClose={ () => setIsLinkOpen( false ) }
					>
						<KeyboardShortcuts
							bindGlobal
							shortcuts={ {
								escape: () => setIsLinkOpen( false ),
							} }
						/>
						<LinkControlSearchInput
							value={ link }
							settings={ false }
							showSuggestions={ false }
							onChange={ ( updatedValue ) =>
								setLink( updatedValue )
							}
							onRemove={ ( p ) => console.log( p ) }
						/>
					</Popover>
				) }
			</div>
		</Draggable>
	);
}

export default memo( Tag );
