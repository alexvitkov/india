
arrows = [];

const minSpeed = 3;
const maxSpeed = 8;
const delay = 1500;
const lifetime = 25000;

function make_arrow() {
	const svg = document.getElementById("protoarrow").cloneNode();
	svg.style.left = Math.random() * 100 + '%';
	svg.style.display = 'block';
	document.getElementById('arrows').append(svg);
	const ob = {
		y: -800, 
		svg: svg, 
		speed: Math.random() * (maxSpeed - minSpeed) + minSpeed
	};
	arrows.push(ob);
	setTimeout(make_arrow, delay);
	setTimeout(() => {
		svg.remove();
		arrows.remove(ob);
	}, lifetime);
}

function update() {
	for (const arrow of arrows) {
		arrow.y += arrow.speed;
		arrow.svg.style.bottom = arrow.y + 'px';
	}
	
	window.requestAnimationFrame(update);
}

make_arrow();
update();
