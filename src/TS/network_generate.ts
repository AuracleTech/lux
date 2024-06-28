import { Node, Link } from "./network_types.ts";

const getRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, ${70}%, ${50}%)`;

function generateGraph(numNodes: number, numLinks: number): { nodes: Node[]; links: Link[]; } {
	const nodes = [];
	const links = [];

	for (let i = 0; i < numNodes; i++) {
		const color = getRandomColor();
		const node = {
			id: `Node-${i}`,
			x: 50 - Math.random() * 100,
			y: 50 - Math.random() * 100,
			vx: 0,
			vy: 0,
			isDragging: false,
			color: color,
			label: `${i}`,
		};
		nodes.push(node);
	}

	for (let i = 0; i < numLinks; i++) {
		const sourceIndex = Math.floor(Math.random() * numNodes);
		let targetIndex = Math.floor(Math.random() * numNodes);

		while (targetIndex === sourceIndex) {
			targetIndex = Math.floor(Math.random() * numNodes);
		}

		const link = {
			source: nodes[sourceIndex],
			target: nodes[targetIndex],
		};
		links.push(link);
	}

	return { nodes, links };
}

function genPolygon(numSides: number) {
	const nodes = [];
	const links = [];

	for (let i = 0; i < numSides; i++) {
		const angle = (i * 2 * Math.PI) / numSides;
		const x = Math.cos(angle) + Math.random() * 10;
		const y = Math.sin(angle) + Math.random() * 10;
		const color = getRandomColor();
		const node = {
			id: `Node-${i}`,
			x: x,
			y: y,
			vx: 0,
			vy: 0,
			isDragging: false,
			color: color,
			label: `${i}`,
		};
		nodes.push(node);
	}

	for (let i = 0; i < numSides; i++) {
		const sourceIndex = i;
		const targetIndex = (i + 1) % numSides;
		const link = {
			source: nodes[sourceIndex],
			target: nodes[targetIndex],
		};
		links.push(link);
	}

	return { nodes, links };
}

function gen3DPolygon(numSides: number) {
	const nodes = [];
	const links = [];

	for (let i = 0; i < numSides; i++) {
		const angle = (i * 2 * Math.PI) / numSides;
		const x = Math.cos(angle);
		const y = Math.sin(angle);
		const color = getRandomColor();
		const node = {
			id: `Node-${i}`,
			x: x,
			y: y,
			vx: 0,
			vy: 0,
			isDragging: false,
			color: color,
			label: `${i}`,
		};
		nodes.push(node);
	}

	for (let i = 0; i < numSides; i++) {
		const sourceIndex = i;
		const targetIndex = (i + 1) % numSides;
		const link = {
			source: nodes[sourceIndex],
			target: nodes[targetIndex],
		};
		links.push(link);
	}

	const z = 100;
	const nodes2 = nodes.map((node) => {
		const newNode = { ...node };
		newNode.y += z;
		return newNode;
	});

	nodes.forEach((node, i) => {
		const link = {
			source: node,
			target: nodes2[i],
		};
		links.push(link);
	});

	for (let i = 0; i < numSides; i++) {
		const sourceIndex = i;
		const targetIndex = (i + 1) % numSides;
		const link = {
			source: nodes2[sourceIndex],
			target: nodes2[targetIndex],
		};
		links.push(link);
	}

	return { nodes: [...nodes, ...nodes2], links };
}

export { generateGraph, genPolygon, gen3DPolygon };
