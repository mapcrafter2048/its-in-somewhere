import type * as THREE from 'three';
export interface LightCandidate {
    position: THREE.Vector3;
    strength?: number;
}
/** Retain only the nearest pooled lights, reusing the caller-owned array. */
export function nearestLights<T extends LightCandidate>(sites: readonly T[], camera: THREE.Vector3, result: T[], limit: number) {
    for (const site of sites) {
        if ((site.strength ?? 0) <= .01)
            continue;
        const distance = site.position.distanceToSquared(camera);
        let at = 0;
        while (at < result.length && result[at].position.distanceToSquared(camera) <= distance)
            at++;
        if (at >= limit)
            continue;
        result.splice(at, 0, site);
        if (result.length > limit)
            result.pop();
    }
}
