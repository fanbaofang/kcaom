Sub sbPrintColorIndexColors()
Dim iCntr
For iCntr = 1 To 56
Cells(iCntr, 1).Interior.ColorIndex = iCntr
Cells(iCntr, 1) = iCntr
Next iCntr
End Sub
//更新脚本