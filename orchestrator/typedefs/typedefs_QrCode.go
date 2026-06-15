package typedefs

type QrCodeData_t struct {
	RegistrationUrl string `json:"registration_url"`
	Uid             string `json:"uid"`
	ReadyForDisplay bool   `json:"readyForDisplay"`
}
