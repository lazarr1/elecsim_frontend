/*  Class: wire 
    * Base class for the hline and vline class. Defines the common functionality and key values
    *  for each and allows the hline and vline class to handle their own method of drawing.
    *  Each wire will store the two wires connected at end points and ensure it is connected to Each
    *  of them
    *      
    * The line class is used to represent the wires of the circuit.
    *      Member functions:
    */

import WireManager from "../../public/components/wire";

function roundCoords(x: number,y: number): [number, number]{
	return [Math.round(x/20)*20, Math.round(y/20)*20];
}

abstract class wire{
	graphic: HTMLElement | null;
	hover_info: HTMLElement;
	DC_voltage: number;
	private eventListeners: Map<string, (event: Event) => void> = new Map();
	private mouseOverBind: (event: Event) => void;

    // Start and End are coordinates [x1,y1] and [x2,y2]
    constructor(
		public start: [number, number],
		public end: [number, number], 
		public offset: boolean,
		public id: string, 
		public wm: WireManager
	){
        //Create html element
        this.graphic = document.createElement('div');
        this.graphic!.classList.add('wire');
        document.body.appendChild(this.graphic);
        this.DC_voltage = 0;

        //Implement hover over, showing voltage at the wire functionality
        // The css will handle the display of the tooltip text
        this.graphic!.classList.add('tooltip');
        this.hover_info = document.createElement('span');
        this.hover_info.classList.add('tooltiptext');
        this.hover_info.innerHTML = 'DC: ' + this.DC_voltage;
        this.graphic!.appendChild(this.hover_info);

        //Store all bindings
        this.eventListeners.set('handleKeydown', this.handleKeyDown.bind(this));
        this.eventListeners.set('onMouseLeave', this.onMouseLeave.bind(this));
		this.eventListeners.set('onMouseMove', this.handleMouseMove.bind(this));

		this.mouseOverBind = this.onMouseOver.bind(this);
		this.graphic!.addEventListener("mouseover", this.mouseOverBind);
    }

    setVoltage(voltage: number): void {
        this.DC_voltage = voltage;
    }
    

    onMouseOver(event: MouseEvent): void {
        this.graphic!.addEventListener('mouseleave', this.eventListeners.get('onMouseLeave')!);
        document.addEventListener('keydown', this.eventListeners.get('handleKeydown')!);
        this.graphic!.addEventListener('mousemove', this.eventListeners.get('onMouseMove')!);

        this.hover_info.innerHTML = `DC:  ${this.DC_voltage}`;
        this.hover_info.style.left = `${event.clientX - 10}px`;
        this.hover_info.style.top = `${event.clientY}px`;
    }

    handleKeyDown(event: KeyboardEvent): void {
        //If backspace while hovering
        if(event.key === 'Backspace'){
            this.delete();
        }
    }

    onMouseLeave(): void{
        this.graphic!.removeEventListener('mouseleave', this.eventListeners.get('onMouseLeave')!);
        document.removeEventListener('keydown', this.eventListeners.get('handleKeydown')!);
        this.graphic!.removeEventListener('mousemove', this.eventListeners.get('onMouseMove')!);
    }

    handleMouseMove(event: MouseEvent){
        this.hover_info.style.left = `${event.clientX + 10}px`; 
        this.hover_info.style.top = `${event.clientY}px`;
    }

    abstract Draw(): void;

    updateStart(start: [number, number]): void {
        this.start = start;
        this.Draw();
    }

    updateEnd(end: [number, number]): void {
        this.end = end;
        this.Draw();
    }

    delete(): void{
        this.graphic!.removeEventListener("mouseover",this.mouseOverBind);
        this.onMouseLeave();

		//this.graphic!.removeChild(this.graphic!.lastChild);
        this.graphic!.remove();
		this.graphic = null;

        this.wm.deleteWire(this.id);
        this.hover_info.remove();
    }

    abstract merge(wire: wire): void;
}


class hwire extends wire{
    Draw(): void {

        if(this.offset){
            this.graphic!.style.top = `${this.end[1]}px`;
        }
        else{
            this.graphic!.style.top = `${this.start[1]}px`;
        }

        const delta = this.end[0]-this.start[0];

        if(delta >= 0){        
            this.graphic!.style.left = `${this.start[0]}px`;
        }
        else{
            this.graphic!.style.left = `${this.end[0]}px`;
        }

        this.graphic!.style.width = `${Math.abs(delta)}px`;

    }

    merge(wire: hwire): void{

        if(!wire)
            return;

        const thisPos = this.graphic!.getBoundingClientRect();
        const wirePos = wire.graphic!.getBoundingClientRect();

        if(thisPos.y !== wirePos.y){
            return;
        }

        if(wire !== this && wire.graphic!.style.height == this.graphic!.style.height){
            const minX = Math.min(wire.start[0], wire.end[0], this.start[0], this.end[0]); 
            const maxX = Math.max(wire.start[0], wire.end[0], this.start[0], this.end[0]);

            const start: [number, number] = [minX, this.start[1]];
            const end: [number, number] = [maxX, this.end[1]];

            this.updateEnd(end);
            this.updateStart(start);


            wire.delete();
            
        }

    }

}

class vwire extends wire{
    Draw(){
        const delta = this.end[1] - this.start[1]
        this.graphic!.style.height = `${Math.abs(delta)}px`;

        if(this.offset){
            this.graphic!.style.left = `${this.end[0]}px`;
        }
        else{

            this.graphic!.style.left = `${this.start[0]}px`;
        }


        if(delta <  0){
            this.graphic!.style.top = `${this.end[1]}px`;
        }
        else{
            this.graphic!.style.top = `${this.start[1]}px`;
        }


    }
    
    merge(wire: vwire): void {
        if(!wire)
            return;

        const thisPos = this.graphic!.getBoundingClientRect();
        const wirePos = wire.graphic!.getBoundingClientRect();

        if(thisPos.x !== wirePos.x){
            return;
        }
        if(wire !== this && wire.graphic!.style.width == this.graphic!.style.width){
            const minY = Math.min(wire.start[1], wire.end[1], this.start[1], this.end[1]); 
            const maxY = Math.max(wire.start[1], wire.end[1], this.start[1], this.end[1]);

            const start: [number, number] = [this.start[0], minY];
            const end: [number, number] = [this.end[0], maxY];

            this.updateEnd(end);
            this.updateStart(start);


            wire.delete();
            
        }
    }
}

export {vwire, hwire}
