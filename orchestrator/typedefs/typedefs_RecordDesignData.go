package typedefs

type RecordDesignData_t struct {
	LabelDesign     LabelDesignData_t `json:"labelDesign"`
	RingDesign      RingDesignData_t  `json:"ringDesign"`
	ReadyForDisplay bool          `json:"readyForDisplay"`
}

type LabelDesignData_t struct {
	UsesImage  bool   `json:"usesImage"`
	LabelColor string `json:"labelColor"`
	LabelImage string `json:"labelImage"`
}

type RingDesignData_t struct {
	UsesImage bool   `json:"usesImage"`
	RingColor string `json:"ringColor"`
	RingImage string `json:"ringImage"`
}
