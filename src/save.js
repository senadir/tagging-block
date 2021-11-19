/**
 * Extneral depenencies
 */
import { cloneElement, Children } from '@wordpress/element';
/**
 * Internal dependencies
 */
import Save from './image/save';
import Tag from './components/tag/save';

export default function save( { attributes } ) {
	const { tags, ...imageAttributes } = attributes;
	const OriginalImage = Save( { attributes: imageAttributes } );
	const Tags = (
		<div className="tags">
			{ tags.map( ( tag ) => (
				<Tag { ...tag } key={ tag.id } />
			) ) }
		</div>
	);
	return cloneElement( OriginalImage, OriginalImage.props, [
		...Children.toArray( OriginalImage.props.children ),
		Tags,
	] );
}
