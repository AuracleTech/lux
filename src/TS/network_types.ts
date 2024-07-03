type id = number;

export type Node = {
	id: id;

	x: number;
	y: number;

	vx: number;
	vy: number;

	isDragging: boolean;
	color: string;
	label: string;
};

export type Link = {
	source: id;
	target: id;
};