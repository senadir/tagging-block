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
	className,
	style,
	id = null,
} ) {
	const nodeRef = useRef();
	const [ isLinkOpen, setIsLinkOpen ] = useState( ! id );
	const [ internalLink, setInternalLink ] = useState( link );
	const handleClosingPopover = useCallback( () => {
		setIsLinkOpen( false );
		onUpdate( internalLink );
	}, [ internalLink, onUpdate ] );
	if ( initialX === undefined && initialY === undefined ) {
		return null;
	}
	return (
		<Draggable
			disabled={ ! onMove }
			handle=".tag-handle"
			position={ { x: initialX, y: initialY } }
			onStop={ ( _, { x, y } ) => onMove( x, y ) }
			nodeRef={ nodeRef }
		>
			<div ref={ nodeRef } className="tag">
				<div
					className={ classnames( 'tag-handle', className ) }
					style={ style }
					id={ id }
				/>
				<>
					{ !! link?.text && (
						<button
							onClick={ () =>
								setIsLinkOpen( ( prev ) => ! prev )
							}
							className={ classnames( 'tag-tooltip', className, {
								'has-link': link.url,
							} ) }
							style={ style }
						>
							{ link.text }
						</button>
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
