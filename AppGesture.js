var AppGesture = function(app){
	this._app = app
	// init hammer.js for gesture
	this._hammertime = new Hammer(renderer.domElement);
	this._hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });

	//////////////////////////////////////////////////////////////////////////////
	//                handle Hit Tester
	//////////////////////////////////////////////////////////////////////////////
	
	var hitTesting = new ARjs.HitTesting(arSession)
	this._app._onUpdateFcts.push(function(){
		// ignore if no object is selected
		if( app.selectedApplet === null )	return

		var object3d = app.selectedApplet.parent
		hitTesting.update(camera, object3d, arAnchor.parameters.changeMatrixMode)
	})
	this._hitTesting = hitTesting

	//////////////////////////////////////////////////////////////////////////////
	//		init position/rotation/scale
	//////////////////////////////////////////////////////////////////////////////

	this._initPosition()
	this._initRotation()
	this._initScale()
}

//////////////////////////////////////////////////////////////////////////////
//		Gesture Position
//////////////////////////////////////////////////////////////////////////////
AppGesture.prototype._initPosition = function(){
	var app = this._app
	var _this = this
	
	// Picking to set object position
        // renderer.domElement.addEventListener("click", function(domEvent){
	this._hammertime.on('tap', function(event) {
		var domEvent = event.srcEvent
		// ignore if no object is selected
		if( app.selectedApplet === null )	return
	
		// accept the click IIF ui is fully visible
		if( app.uiAutoHide.getOpacity() !== 1 )	return

		var hitTestResults = _this._hitTesting.testDomEvent(domEvent)
		if( hitTestResults.length === 0 )	return
	
		var hitTestResult = hitTestResults[0]
		var object3d = app.selectedApplet.parent
		hitTestResult.applyPosition(object3d)
		if( app.trackingBackend === 'tango' ){
			hitTestResult.applyQuaternion(object3d)
		}

		app.onAppletsUpdate()
	})
}

//////////////////////////////////////////////////////////////////////////////
//		Gesture rotation
//////////////////////////////////////////////////////////////////////////////
AppGesture.prototype._initRotation = function(){
	var app = this._app

	this._hammertime.on('pan', function(event) {
		if( event.additionalEvent !== 'panright' && event.additionalEvent !== 'panleft' )	return

		// ignore if no object is selected
		if( app.selectedApplet === null )	return

		
		var delta = event.velocityX / window.innerWidth * 60
		var demoRoot = app.selectedApplet.parent

		// FIXME is that needed
		if( app.trackingBackend !== 'tango' ){	// TODO yuck!!!
			demoRoot.rotation.y +=  delta		
		}else{
			demoRoot.rotateY( delta )
		}
		
		app.onAppletsUpdate()
	});
}

//////////////////////////////////////////////////////////////////////////////
//		Gesture scale
//////////////////////////////////////////////////////////////////////////////
AppGesture.prototype._initScale = function(){
	var app = this._app

	this._hammertime.get('pinch').set({ enable: true })
	
	this._hammertime.on('pinch', function(event) {
		var delta = -event.overallVelocityY/window.innerHeight * 100
		delta = THREE.Math.clamp(delta, -0.5, 0.5)		
		scaleDelta(delta)
	})

	this._hammertime.on('pan', function(event) {
		if( event.additionalEvent !== 'panup' && event.additionalEvent !== 'pandown' )	return
		var delta = -event.velocityY/window.innerHeight * 60
		delta = THREE.Math.clamp(delta, -0.2, 0.2)		
		scaleDelta(delta)
	})
	return

	function scaleDelta(delta){
		// ignore if no object is selected
		if( app.selectedApplet === null )	return

		var demoRoot = app.selectedApplet.parent
		
		var scale = demoRoot.scale.x * (1 + delta)
		scale = THREE.Math.clamp(scale, 0.2, 10)
		demoRoot.scale.set(scale, scale, scale)
		
		app.onAppletsUpdate()		
	}
}