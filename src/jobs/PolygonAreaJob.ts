import { Job } from './Job';
import { Task } from '../models/Task';
import { area } from '@turf/turf';
import { Polygon, MultiPolygon } from 'geojson';

export class PolygonAreaJob implements Job {
    async run(task: Task): Promise<any> {
        try {
            const geoJsonData = JSON.parse(task.geoJson);
            if (geoJsonData.type !== 'Polygon' && geoJsonData.type !== 'MultiPolygon') {
                throw new Error('Invalid GeoJSON type. Expected Polygon or MultiPolygon.');
            }

            const polygonArea = area(geoJsonData as Polygon | MultiPolygon);
            
            return {
                area: polygonArea,
                unit: 'square meters'
            };
        } catch (error: any) {
            throw new Error(`Failed to calculate polygon area: ${error.message}`);
        }
    }
}
