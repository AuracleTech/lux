import { Node, Link } from "./network_types.ts";

const getRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, ${70}%, ${50}%)`;

export function genRandomGraph(numNodes: number, numLinks: number): { nodes: Node[]; links: Link[]; } {
	const nodes = [];
	const links = [];

	for (let i = 0; i < numNodes; i++) {
		const color = getRandomColor();
		const node = {
			id: i,
			x: 50 - Math.random() * 100,
			y: 50 - Math.random() * 100,
			vx: 0,
			vy: 0,
			isDragging: false,
			color: color,
			label: i.toString(),
		};
		nodes.push(node);
	}

	for (let i = 0; i < numLinks; i++) {
		links.push({
			source: Math.floor(Math.random() * numNodes),
			target: Math.floor(Math.random() * numNodes),
		});
	}

	return { nodes, links };
}

export function genPolygon(numSides: number): { nodes: Node[]; links: Link[]; } {
	const nodes = [];
	const links = [];

	for (let i = 0; i < numSides; i++) {
		const angle = (i * 2 * Math.PI) / numSides;
		nodes.push({
			id: i,
			x: 50 - 40 * Math.cos(angle),
			y: 50 - 40 * Math.sin(angle),
			vx: 0,
			vy: 0,
			isDragging: false,
			color: getRandomColor(),
			label: i.toString(),
		});
	}

	for (let i = 0; i < numSides; i++) {
		links.push({
			source: i,
			target: (i + 1) % numSides,
		});
	}

	return { nodes, links };
}
