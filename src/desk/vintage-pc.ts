import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { part } from '../prop-models';
/** A chair-facing 486 workstation. Fixed plastic, keys and cables share one draw. */
export function buildVintagePC(unit: THREE.BufferGeometry, screenTexture: THREE.Texture, legends: THREE.Texture) {
    const root = new THREE.Group();
    root.name = 'vintage-workstation';
    const groups = Object.fromEntries(['monitor', 'keyboard', 'mouse', 'tower'].map(name => {
        const g = new THREE.Group();
        g.name = `vintage-${name}`;
        root.add(g);
        return [name, g];
    })) as Record<string, THREE.Group>;
    const plastic = 0xb6ac8c, light = 0xd3c8a8, dark = 0x41463c;
    const box = (g: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, color = plastic) => part(g, x, y, z, w, h, d, color, 0, unit);
    const monitor = groups.monitor;
    box(monitor, 0, .965, -.03, .38, .05, .35);
    box(monitor, 0, 1.045, -.04, .16, .11, .16);
    // Tapered, deep CRT shell, wider at the glass than at the rear ventilation panel.
    const front = [[-.365, 1.10, .23], [.365, 1.10, .23], [.365, 1.67, .23], [-.365, 1.67, .23]];
    const back = [[-.25, 1.17, -.32], [.25, 1.17, -.32], [.25, 1.60, -.32], [-.25, 1.60, -.32]];
    const shell = new THREE.BufferGeometry();
    shell.setAttribute('position', new THREE.Float32BufferAttribute([...front, ...back].flat(), 3));
    shell.setIndex([0, 1, 2, 0, 2, 3, 5, 4, 7, 5, 7, 6, 4, 0, 3, 4, 3, 7, 1, 5, 6, 1, 6, 2, 3, 2, 6, 3, 6, 7, 4, 5, 1, 4, 1, 0]);
    shell.computeVertexNormals();
    const casing = new THREE.Mesh(shell, new THREE.MeshStandardMaterial({ color: plastic, roughness: .88 }));
    monitor.add(casing);
    box(monitor, 0, 1.405, .25, .59, .415, .025, dark);
    box(monitor, 0, 1.645, .275, .73, .055, .09, light);
    box(monitor, 0, 1.145, .275, .73, .09, .09, light);
    for (const side of [-1, 1])
        box(monitor, side * .335, 1.405, .275, .06, .43, .09, light);
    box(monitor, -.13, 1.147, .324, .21, .026, .006, 0x737866);
    box(monitor, .267, 1.15, .33, .035, .025, .012, dark);
    for (let i = 0; i < 8; i++)
        box(monitor, 0, 1.275 + i * .031, -.324, .405, .009, .008, dark);
    box(monitor, 0, 1.205, -.326, .19, .05, .006, light);
    for (let i = 0; i < 3; i++)
        box(monitor, -.015, 1.194 + i * .012, -.331, .12 - i * .02, .003, .002, 0x737866);
    const lensGeometry = new THREE.PlaneGeometry(.52, .345, 16, 12), positions = lensGeometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) / .26, y = positions.getY(i) / .1725;
        positions.setZ(i, .017 * Math.max(0, 1 - x * x * .55 - y * y * .45));
    }
    lensGeometry.computeVertexNormals();
    const screen = new THREE.Mesh(lensGeometry, new THREE.MeshBasicMaterial({ map: screenTexture }));
    screen.name = 'crt-curved-glass';
    screen.position.set(0, 1.405, .266);
    monitor.add(screen);
    const indicator = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: 0xd9b46a }));
    indicator.name = 'mail-indicator';
    indicator.position.set(-.284, 1.15, .328);
    indicator.scale.set(.014, .012, .007);
    monitor.add(indicator);
    const keyboard = groups.keyboard;
    box(keyboard, 0, .969, .50, .76, .058, .28);
    box(keyboard, -.075, .999, .50, .57, .008, .235, dark);
    box(keyboard, .282, .999, .50, .154, .008, .235, dark);
    const labelPieces: THREE.BufferGeometry[] = [];
    const glyphs = ['', 'Esc', ...'1234567890-='.split(''), ...'QWERTYUIOP[]'.split(''), ...'ASDFGHJKL;\''.split(''), ...'ZXCVBNM,./'.split(''), 'Tab', 'Caps', 'Shift', 'Ctrl', 'Alt', 'Enter', '↑', '←', '↓', '→', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'Num', '+', 'Del'];
    const key = (x: number, z: number, label: string, w = .034, color = light) => {
        box(keyboard, x, 1.011, z, w, .018, .031, color);
        const geo = new THREE.PlaneGeometry(w * .86, .027);
        geo.rotateX(-Math.PI / 2);
        geo.translate(x, 1.0205, z);
        const slot = Math.max(0, glyphs.indexOf(label)), uv = geo.getAttribute('uv'), col = slot % 16, row = Math.floor(slot / 16);
        for (let i = 0; i < uv.count; i++)
            uv.setXY(i, (col + uv.getX(i)) / 16, 1 - (row + 1 - uv.getY(i)) / 5);
        labelPieces.push(geo);
    };
    const rows = ['1234567890-=', 'QWERTYUIOP[]', 'ASDFGHJKL;\'', 'ZXCVBNM,./'];
    rows.forEach((row, r) => {
        key(-.33, .445 + r * .038, ['Esc', 'Tab', 'Caps', 'Shift'][r], .05, 0x9d9e8b);
        [...row].forEach((label, c) => key(-.278 + c * .038, .445 + r * .038, label));
    });
    for (let i = 0; i < 10; i++)
        key(-.32 + i * .047, .398, `F${i + 1}`, .032, 0x9d9e8b);
    key(-.32, .597, 'Ctrl', .05);
    key(-.257, .597, 'Alt', .05);
    key(-.09, .597, '', .25);
    key(.074, .597, '←');
    key(.114, .597, '↓');
    key(.154, .597, '→');
    ['789', '456', '123', '0.+'].forEach((row, r) => [...row].forEach((label, c) => key(.232 + c * .042, .445 + r * .047, label)));
    const labelsGeometry = mergeGeometries(labelPieces)!;
    labelPieces.forEach(g => g.dispose());
    const labels = new THREE.Mesh(labelsGeometry, new THREE.MeshBasicMaterial({ map: legends, transparent: true, alphaTest: .15, depthWrite: false }));
    labels.name = 'keyboard-legends';
    keyboard.add(labels);
    const mouse = groups.mouse;
    box(mouse, .49, .947, .50, .18, .014, .26, 0x686d5c);
    const mouseGeometry = new THREE.SphereGeometry(1, 12, 8), mouseMesh = new THREE.Mesh(mouseGeometry, new THREE.MeshStandardMaterial({ color: light, roughness: .85 }));
    mouseMesh.position.set(.49, .975, .50);
    mouseMesh.scale.set(.067, .025, .096);
    mouse.add(mouseMesh);
    for (const side of [-1, 1])
        box(mouse, .49 + side * .027, .997, .468, .049, .009, .065, plastic);
    box(mouse, .49, 1.002, .466, .004, .004, .072, dark);
    const cable = (g: THREE.Group, points: number[][]) => {
        const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [
            number,
            number,
            number
        ]))), 16, .0045, 4, false);
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: dark, roughness: .95 }));
        g.add(mesh);
    };
    cable(mouse, [[.49, .96, .41], [.53, .949, .25], [.40, .949, .13], [.30, .949, -.25]]);
    cable(monitor, [[0, 1.21, -.33], [-.18, 1.03, -.40], [-.23, .949, -.35], [.10, .80, -.23]]);
    const tower = groups.tower;
    box(tower, .15, .35, -.02, .265, .58, .48);
    for (const x of [.055, .245])
        for (const z of [-.20, .16])
            box(tower, x, .03, z, .045, .06, .065, dark);
    box(tower, .15, .35, .228, .24, .56, .02, light);
    box(tower, .15, .574, .242, .205, .049, .012, 0x9d9e8b);
    box(tower, .15, .576, .250, .16, .005, .004, dark);
    box(tower, .22, .558, .25, .022, .008, .005, dark);
    box(tower, .15, .485, .242, .205, .045, .012, plastic);
    box(tower, .15, .489, .25, .14, .009, .005, dark);
    box(tower, .17, .185, .245, .032, .032, .014, dark);
    box(tower, .11, .185, .25, .011, .011, .006, 0x7f9765);
    for (let i = 0; i < 7; i++)
        box(tower, .15, .27 + i * .019, .243, .15, .005, .005, 0x777a67);
    for (let i = 0; i < 8; i++)
        box(tower, .15, .27 + i * .023, -.263, .20, .008, .006, dark);
    box(tower, .15, .56, -.268, .12, .055, .015, dark);
    const components: Record<string, THREE.Box3> = {};
    root.updateMatrixWorld(true);
    components.mouseBody = new THREE.Box3().setFromObject(mouseMesh);
    for (const [name, g] of Object.entries(groups))
        components[name] = new THREE.Box3().setFromObject(g);
    const solids: THREE.Mesh[] = [];
    root.traverse(o => {
        if (o instanceof THREE.Mesh && o !== screen && o !== indicator && o !== labels)
            solids.push(o);
    });
    const pieces = solids.map(mesh => {
        const geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
        if (!geo.hasAttribute('uv'))
            geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2));
        const color = (mesh.material as THREE.MeshStandardMaterial).color, colors = new Float32Array(geo.getAttribute('position').count * 3);
        for (let i = 0; i < colors.length; i += 3) {
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geo;
    });
    const merged = mergeGeometries(pieces)!;
    pieces.forEach(g => g.dispose());
    solids.forEach(mesh => {
        mesh.removeFromParent();
        if (mesh.geometry !== unit)
            mesh.geometry.dispose();
    });
    const solid = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .88 }));
    solid.name = 'vintage-pc-solids';
    solid.castShadow = solid.receiveShadow = true;
    root.add(solid);
    root.position.set(-.64, 0, .04);
    root.rotation.y = Math.PI;
    return { root, indicator, screen, components, glyphs };
}
export function keyboardLegendTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#343a32';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Keep the atlas order paired with the keyboard layout without allocating a texture per key.
    const glyphs = ['', 'Esc', ...'1234567890-='.split(''), ...'QWERTYUIOP[]'.split(''), ...'ASDFGHJKL;\''.split(''), ...'ZXCVBNM,./'.split(''), 'Tab', 'Caps', 'Shift', 'Ctrl', 'Alt', 'Enter', '↑', '←', '↓', '→', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'Num', '+', 'Del'];
    glyphs.forEach((label, i) => {
        ctx.font = `${label.length > 2 ? 15 : 23}px monospace`;
        ctx.fillText(label, (i % 16) * 64 + 32, Math.floor(i / 16) * 64 + 32);
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
