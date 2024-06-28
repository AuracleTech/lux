export type Node = {
	id: string;
	x: number;
	y: number;

	vx: number;
	vy: number;

	isDragging: boolean;
	color: string;
	label: string;
};

export type Link = {
	source: Node;
	target: Node;
};
