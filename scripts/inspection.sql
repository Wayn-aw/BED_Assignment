USE [bed_db]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Inspection](
	[InspectionID] [int] IDENTITY(1,1) NOT NULL,
	[InspectionDate] [date] NULL,
	[HygieneGrade] [char](1) NULL,
	[GradeExpiry] [date] NULL,
	[OfficerID] [int] NULL,
	[StallID] [int] NULL,
 CONSTRAINT [PK_Inspection] PRIMARY KEY CLUSTERED 
(
	[InspectionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Inspection]  WITH CHECK ADD  CONSTRAINT [FK_Inspection_Officer] FOREIGN KEY([OfficerID])
REFERENCES [dbo].[NEA_Officer] ([OfficerID])
GO
ALTER TABLE [dbo].[Inspection] CHECK CONSTRAINT [FK_Inspection_Officer]
GO
ALTER TABLE [dbo].[Inspection]  WITH CHECK ADD  CONSTRAINT [FK_Inspection_Stall] FOREIGN KEY([StallID])
REFERENCES [dbo].[FoodStall] ([StallID])
GO
ALTER TABLE [dbo].[Inspection] CHECK CONSTRAINT [FK_Inspection_Stall]
GO
ALTER TABLE [dbo].[Inspection]  WITH CHECK ADD  CONSTRAINT [CK_Inspection_Expiry] CHECK  (([GradeExpiry]>[InspectionDate]))
GO
ALTER TABLE [dbo].[Inspection] CHECK CONSTRAINT [CK_Inspection_Expiry]
GO
ALTER TABLE [dbo].[Inspection]  WITH CHECK ADD  CONSTRAINT [CK_Inspection_Grade] CHECK  (([HygieneGrade]='D' OR [HygieneGrade]='C' OR [HygieneGrade]='B' OR [HygieneGrade]='A'))
GO
ALTER TABLE [dbo].[Inspection] CHECK CONSTRAINT [CK_Inspection_Grade]
GO