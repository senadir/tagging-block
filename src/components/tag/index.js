/* eslint-disable @wordpress/no-unsafe-wp-apis */
import Draggable from 'react-draggable';
import { useRef, useState, memo } from '@wordpress/element';
import { KeyboardShortcuts, Popover } from '@wordpress/components';
import classnames from 'classnames';
import LinkControl from '../link-control';
function Tag( { x: initialX, y: initialY, link = {}, onMove, onUpdate } ) {
	const nodeRef = useRef();
	const [ isDragging, setIsDragging ] = useState( false );
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );
	return (
		<Draggable
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
					{ !! link.text && (
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
							onClose={ () => setIsLinkOpen( false ) }
						>
							<KeyboardShortcuts
								bindGlobal
								shortcuts={ {
									escape: () => setIsLinkOpen( false ),
								} }
							/>
							<LinkControl
								hasTextControl
								className="wp-block-navigation-link__inline-link-input"
								value={ link }
								showInitialSuggestions={ false }
								withCreateSuggestion={ false }
								noDirectEntry={ false }
								noURLSuggestion={ false }
								onChange={ ( newValue ) =>
									onUpdate( { ...link, ...newValue } )
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
