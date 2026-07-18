USE [bed_db]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[InspectionRemark](
	[InspectionID] [int] IDENTITY(1,1) NOT NULL,
	[InspectionRemark] [varchar](MAX) NULL,
 CONSTRAINT [PK_InspectionRemark] PRIMARY KEY CLUSTERED 
(
	[InspectionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[InspectionRemark]  WITH CHECK ADD  CONSTRAINT [FK_InspectionRemark_Inspection] FOREIGN KEY([InspectionID])
REFERENCES [dbo].[Inspection] ([InspectionID])
GO
ALTER TABLE [dbo].[InspectionRemark] CHECK CONSTRAINT [FK_InspectionRemark_Inspection]
GO