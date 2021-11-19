export default function ( { x, y, link, id } ) {
	const style = {
		top: `${ y * 100 }%`,
		left: `${ x * 100 }%`,
	};
	return (
		<div className="tag" style={ style } id={ id }>
			<div className="tag-handle" />
		</div>
	);
}
