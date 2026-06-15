import { DataSource } from "../../js/datasource";
import { QrCodeData_t, WidgetState, Global_QrCodeWidgetData, Global_QrCodeWidgetState } from "../../types/state";
import { QrCodeWidget } from "./qrcode_app";

export class QrCodeWidgetPlayback_t {

    private applyState(state: number): void {
        switch (state) {
            case WidgetState.Show:
                QrCodeWidget.show();
                break;

            case WidgetState.Hide:
                QrCodeWidget.hide();
                break;
        }
    }

    public async init(dataSource: DataSource): Promise<void> {
        dataSource.onStateChanged((variable: unknown, data: unknown) => {
            const globalVariable = variable as string;

            switch (globalVariable) {
                case Global_QrCodeWidgetData.key:
                    QrCodeWidget.updateData(QrCodeData_t.fromJson(data));
                    break;

                case Global_QrCodeWidgetState:
                    this.applyState(data as number);
                    break;
            }
        });

        const currentData = await dataSource.read<QrCodeData_t>(Global_QrCodeWidgetData);
        QrCodeWidget.updateData(currentData);

        const currentState = await dataSource.read<number>(Global_QrCodeWidgetState);
        this.applyState(currentState);
    }
}

export const QrCodeWidgetPlayback = new QrCodeWidgetPlayback_t();
