import {
	BODY_CORNER_MAX,
	NECK_CURVE_MAX,
	PILL_HEIGHT as PH,
	PILL_RADIUS as PR,
	PILL_THRESHOLD
} from './constants';

type PathFn = (pw: number, bw: number, th: number, t: number) => string;

// Memo de una sola entrada: el driver llama por frame con argumentos casi siempre repetidos
function memoizePath(fn: PathFn): PathFn {
	let lastArgs: [number, number, number, number] | null = null;
	let lastResult = '';
	return (pw, bw, th, t) => {
		if (
			lastArgs &&
			lastArgs[0] === pw &&
			lastArgs[1] === bw &&
			lastArgs[2] === th &&
			lastArgs[3] === t
		) {
			return lastResult;
		}
		lastResult = fn(pw, bw, th, t);
		lastArgs = [pw, bw, th, t];
		return lastResult;
	};
}

// Geometría común a ambas variantes para un progreso t ∈ [0, 1]
function bodyGeometry(th: number, t: number) {
	const bodyH = PH + (th - PH) * t;
	const isPill = t <= 0 || bodyH - PH < PILL_THRESHOLD;
	const curve = NECK_CURVE_MAX * t;
	const cr = Math.min(BODY_CORNER_MAX, (bodyH - PH) * 0.45);
	const bodyTop = PH - curve;
	return { bodyH, isPill, curve, cr, bodyTop };
}

// Píldora de ancho `width` desplazada `x` píxeles a la derecha
function pillPath(x: number, width: number): string {
	return [
		`M ${x},${PR}`,
		`A ${PR},${PR} 0 0 1 ${x + PR},0`,
		`H ${x + width - PR}`,
		`A ${PR},${PR} 0 0 1 ${x + width},${PR}`,
		`A ${PR},${PR} 0 0 1 ${x + width - PR},${PH}`,
		`H ${x + PR}`,
		`A ${PR},${PR} 0 0 1 ${x},${PR}`,
		'Z'
	].join(' ');
}

// Variante alineada a la izquierda: la píldora queda arriba a la izquierda y el cuerpo crece hacia la derecha
function morphPathRaw(pw: number, bw: number, th: number, t: number): string {
	const pillW = Math.min(pw, bw);
	const { bodyH, isPill, curve, cr, bodyTop } = bodyGeometry(th, t);
	if (isPill) return pillPath(0, pillW);

	const bodyW = pillW + (bw - pillW) * t;
	const neckY = bodyTop + curve;
	const qEndX = Math.min(pillW + curve, bodyW - cr);
	return [
		`M 0,${PR}`,
		`A ${PR},${PR} 0 0 1 ${PR},0`,
		`H ${pillW - PR}`,
		`A ${PR},${PR} 0 0 1 ${pillW},${PR}`,
		`L ${pillW},${bodyTop}`,
		`Q ${pillW},${neckY} ${qEndX},${neckY}`,
		`H ${bodyW - cr}`,
		`A ${cr},${cr} 0 0 1 ${bodyW},${neckY + cr}`,
		`L ${bodyW},${bodyH - cr}`,
		`A ${cr},${cr} 0 0 1 ${bodyW - cr},${bodyH}`,
		`H ${cr}`,
		`A ${cr},${cr} 0 0 1 0,${bodyH - cr}`,
		'Z'
	].join(' ');
}

// Variante centrada: la píldora queda centrada y el cuerpo crece hacia ambos lados
function morphPathCenterRaw(pw: number, bw: number, th: number, t: number): string {
	const pillW = Math.min(pw, bw);
	const pillOffset = (bw - pillW) / 2;
	const { bodyH, isPill, curve, cr, bodyTop } = bodyGeometry(th, t);
	if (isPill) return pillPath(pillOffset, pillW);

	const neckY = bodyTop + curve;
	const bodyCenter = bw / 2;
	const halfBodyW = pillW / 2 + ((bw - pillW) / 2) * t;
	const bodyLeft = bodyCenter - halfBodyW;
	const bodyRight = bodyCenter + halfBodyW;
	const qLeftX = Math.max(bodyLeft + cr, pillOffset - curve);
	const qRightX = Math.min(bodyRight - cr, pillOffset + pillW + curve);
	return [
		`M ${pillOffset},${PR}`,
		`A ${PR},${PR} 0 0 1 ${pillOffset + PR},0`,
		`H ${pillOffset + pillW - PR}`,
		`A ${PR},${PR} 0 0 1 ${pillOffset + pillW},${PR}`,
		`L ${pillOffset + pillW},${bodyTop}`,
		`Q ${pillOffset + pillW},${neckY} ${qRightX},${neckY}`,
		`H ${bodyRight - cr}`,
		`A ${cr},${cr} 0 0 1 ${bodyRight},${neckY + cr}`,
		`L ${bodyRight},${bodyH - cr}`,
		`A ${cr},${cr} 0 0 1 ${bodyRight - cr},${bodyH}`,
		`H ${bodyLeft + cr}`,
		`A ${cr},${cr} 0 0 1 ${bodyLeft},${bodyH - cr}`,
		`L ${bodyLeft},${neckY + cr}`,
		`A ${cr},${cr} 0 0 1 ${bodyLeft + cr},${neckY}`,
		`H ${qLeftX}`,
		`Q ${pillOffset},${neckY} ${pillOffset},${bodyTop}`,
		'Z'
	].join(' ');
}

/** Path SVG del blob: píldora (t = 0) que se transforma en cuerpo completo (t = 1). */
export const morphPath: PathFn = memoizePath(morphPathRaw);

/** Igual que `morphPath`, pero con la píldora centrada (posiciones `*-center`). */
export const morphPathCenter: PathFn = memoizePath(morphPathCenterRaw);
