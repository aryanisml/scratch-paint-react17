import paper from 'paper';

/**
 * Applies segment brush functions to the tool. Call them when the corresponding mouse event happens
 * to get the broad brush behavior.
 *
 * Segment brush draws by creating a rounded rectangle for each mouse move event and merging all of
 * those shapes. Unlike the broad brush, the resulting shape will not self-intersect and when you make
 * 180 degree turns, you will get a rounded point as expected. Shortcomings include that performance is
 * worse, especially as the number of segments to join increase, and that there are problems in paper.js
 * with union on shapes with curves, so that chunks of the union tend to disappear.
 * (https://github.com/paperjs/paper.js/issues/1321)
 *
 * @param {!Tool} tool paper.js mouse object
 */
const segmentBrushHelper = function (tool) {
    let lastPoint;
    let finalPath;

    tool.onSegmentMouseDown = function (event) {
        if (event.event.button > 0) return;  // only first mouse button

        tool.minDistance = 1;
        tool.maxDistance = this.options.brushSize;
        
        finalPath = new paper.Path.Circle({
            center: event.point,
            radius: this.options.brushSize / 2
        });
        tool.stylePath(finalPath);
        lastPoint = event.point;
    };
    
    tool.onSegmentMouseDrag = function (event) {
        if (event.event.button > 0) return;  // only first mouse button

        const step = (event.delta).normalize(this.options.brushSize / 2);
        const handleVec = step.clone();
        handleVec.length = this.options.brushSize / 2;
        handleVec.angle += 90;

        const path = new paper.Path();
        
        // TODO: Add back brush styling
        // path = pg.stylebar.applyActiveToolbarStyle(path);
        path.fillColor = 'black';

        // Add handles to round the end caps
        path.add(new paper.Segment(lastPoint.subtract(step), handleVec.multiply(-1), handleVec));
        step.angle += 90;

        path.add(event.lastPoint.add(step));
        path.insert(0, event.lastPoint.subtract(step));
        path.add(event.point.add(step));
        path.insert(0, event.point.subtract(step));

        // Add end cap
        step.angle -= 90;
        path.add(new paper.Segment(event.point.add(step), handleVec, handleVec.multiply(-1)));
        path.closed = true;
        // The unite function on curved paths does not always work (sometimes deletes half the path)
        // so we have to flatten.
        path.flatten(Math.min(5, this.options.brushSize / 5));
        
        lastPoint = event.point;
        const newPath = finalPath.unite(path);
        path.remove();
        finalPath.remove();
        finalPath = newPath;
    };

    tool.onSegmentMouseUp = function (event) {
        if (event.event.button > 0) return;  // only first mouse button

        // TODO: This smoothing tends to cut off large portions of the path! Would like to eventually
        // add back smoothing, maybe a custom implementation that only applies to a subset of the line?

        // Smooth the path.
        finalPath.simplify(2);
        // console.log(finalPath.segments);
        return finalPath;
    };
};

export default segmentBrushHelper;
