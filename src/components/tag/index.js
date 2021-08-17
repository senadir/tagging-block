/* eslint-disable @wordpress/no-unsafe-wp-apis */
import Draggable from 'react-draggable';
import { useRef, useState, useCallback, memo } from '@wordpress/element';
import { KeyboardShortcuts, Popover } from '@wordpress/components';
import classnames from 'classnames';
import LinkControl from '../link-control';
function Tag( {
	x: initialX,
	y: initialY,
	link,
	onMove,
	onUpdate,
	onRemove,
	id = null,
} ) {
	const nodeRef = useRef();
	const [ isDragging, setIsDragging ] = useState( false );
	const [ isLinkOpen, setIsLinkOpen ] = useState( ! id );
	const [ internalLink, setInternalLink ] = useState( link );
	const handleClosingPopover = useCallback( () => {
		setInternalLink( false );
		onUpdate( internalLink );
	}, [ internalLink, onUpdate ] );
	if ( initialX === undefined && initialY === undefined ) {
		return null;
	}
	return (
		<Draggable
			disabled={ ! onMove }
			handle=".tag"
			position={ { x: initialX, y: initialY } }
			onDrag={ () => setIsDragging( true ) }
			onStop={ ( _, { x, y } ) => {
				if ( isDragging ) {
					onMove( x, y );
				} else {
					setIsLinkOpen( ( prev ) => ! prev );
				}
				setIsDragging( false );
			} }
			nodeRef={ nodeRef }
		>
			<div className="tag" ref={ nodeRef }>
				<>
					{ !! link?.text && (
						<span
							className={ classnames( 'tag-tooltip', {
								'has-link': link.url,
							} ) }
						>
							{ link.text }
						</span>
					) }
					{ isLinkOpen && (
						<Popover
							position="bottom center"
							onClose={ handleClosingPopover }
						>
							<KeyboardShortcuts
								bindGlobal
								shortcuts={ {
									escape: handleClosingPopover,
								} }
							/>
							<LinkControl
								hasTextControl
								className="wp-block-navigation-link__inline-link-input"
								value={ internalLink }
								showInitialSuggestions={ false }
								withCreateSuggestion={ false }
								noDirectEntry={ false }
								noURLSuggestion={ false }
								onRemove={ () => onRemove( id ) }
								onChange={ ( newValue ) =>
									setInternalLink( ( oldValue ) => ( {
										...oldValue,
										...newValue,
									} ) )
								}
							/>
						</Popover>
					) }
				</>
			</div>
		</Draggable>
	);
}

export default memo( Tag );
