import { DataSource } from "../../js/datasource";
import { WidgetState, Global_DefinedProjectorErrorMessage, Global_PlaybackErrorMessageState } from "../../types/state";

interface ContextMessagePrivateState {
    dataSource: DataSource | null;
    currentMessage: string;
}

export class ContextMessageWidgetPlayback {
    private _private: ContextMessagePrivateState;

    constructor() {
        this._private = {
            dataSource: null,
            currentMessage: ''
        };
    }

    public applyData(data: string): void {
        window.ContextMessageWidget?.updateData(data);
        return;
    }

    public applyState(state: number): void {

        switch (state) {
            case WidgetState.Show:
                window.ContextMessageWidget?.show();
                break;
                
            case WidgetState.Hide:
                window.ContextMessageWidget?.hide();
                break;
        }
    }

    public async init(dataSource: DataSource): Promise<void> {
        this._private.dataSource = dataSource;

        this._private.dataSource.onStateChanged((variable: unknown, data: unknown) => {
            const globalVariable = variable as string;

            switch (globalVariable) {
                case Global_DefinedProjectorErrorMessage:
                    this.applyData(data as string);
                    break;
                case Global_PlaybackErrorMessageState:
                    this.applyState(data as number);
                    break;
            }
        });

        const currentData = await this._private.dataSource.read<string>(Global_DefinedProjectorErrorMessage);
        this.applyData(currentData);

        const currentState = await this._private.dataSource.read<number>(Global_PlaybackErrorMessageState);
        this.applyState(currentState);
    }
}

window.ContextMessageWidgetPlayback = new ContextMessageWidgetPlayback();